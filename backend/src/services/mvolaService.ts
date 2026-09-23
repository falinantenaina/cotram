import { logError, logInfo } from "../lib/logger.js";

//  Config

const MVOLA_API_URL = process.env.MVOLA_API_URL || "https://api.mvola.mg";
const CONSUMER_KEY =
  process.env.MVOLA_CONSUMER_KEY || process.env.CONSUMER_KEY || "";
const CONSUMER_SECRET =
  process.env.MVOLA_CONSUMER_SECRET || process.env.CONSUMER_SECRET || "";
const MERCHANT_MSISDN =
  process.env.MVOLA_MERCHANT_MSISDN || process.env.MERCHANT_NUMBER || "";
const PARTNER_NAME = process.env.MVOLA_PARTNER_NAME || "COTRAM";

//  Token cache

let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  const credentials = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${MVOLA_API_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials&scope=EXT_INT_MVOLA_SCOPE",
  });

  if (!res.ok) {
    const body = await res.text();
    logError("MVOLA_TOKEN", `status=${res.status} body=${body}`);
    throw new Error(`Erreur authentification MVola: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  logInfo(`Token MVola obtenu (length=${cachedToken.access_token.length})`);
  return cachedToken.access_token;
}

//  Helpers

function generateCorrelationId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    String(now.getMilliseconds()).padStart(3, "0")
  );
}

function buildHeaders(token: string, correlationId: string) {
  return {
    Authorization: `Bearer ${token}`,
    version: "1.0",
    "X-CorrelationID": correlationId,
    UserLanguage: "MG",
    "Accept-Charset": "utf-8",
    "Content-Type": "application/json",
    "User-Agent": "PostmanRuntime/7.56.1",
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  };
}

function buildHeadersWithAccount(token: string, correlationId: string) {
  return {
    ...buildHeaders(token, correlationId),
    UserAccountIdentifier: `msisdn;${MERCHANT_MSISDN}`,
    partnerName: PARTNER_NAME,
  };
}

//  Initier un paiement

export interface InitierPaiementParams {
  telephone_client: string;
  montant: number;
  description?: string;
  reference_client: string;
  callbackURL?: string | undefined;
  metadata?: { key: string; value: string }[];
}

export interface MvolaInitierResult {
  server_correlation_id: string;
  status: string;
  notification_method: string;
}

export async function initierPaiement(
  params: InitierPaiementParams,
): Promise<MvolaInitierResult> {
  const token = await getAccessToken();
  const correlationId = generateCorrelationId();
  const requestDate = new Date().toISOString();

  const body: Record<string, unknown> = {
    amount: String(params.montant),
    currency: "Ar",
    descriptionText: (
      params.description || "Paiement réservation COTRAM"
    ).slice(0, 50),
    requestingOrganisationTransactionReference: params.reference_client.slice(
      0,
      50,
    ),
    requestDate,
    originalTransactionReference: params.reference_client.slice(0, 50),
    debitParty: [{ key: "msisdn", value: params.telephone_client }],
    creditParty: [{ key: "msisdn", value: MERCHANT_MSISDN }],
    metadata: [
      { key: "partnerName", value: PARTNER_NAME },
      { key: "fc", value: "USD" },
      { key: "amountFc", value: "1" },
      ...(params.metadata || []),
    ],
  };

  if (params.callbackURL) {
    body.callbackURL = params.callbackURL;
  }

  const res = await fetch(
    `${MVOLA_API_URL}/mvola/mm/transactions/type/merchantpay/1.0.0/`,
    {
      method: "POST",
      headers: buildHeaders(token, correlationId),
      body: JSON.stringify(body),
    },
  );

  const rawText = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    logError(
      "MVOLA_INIT",
      `status=${res.status} raw=${rawText.slice(0, 500)} correlationId=${correlationId}`,
    );
    const msg = String(
      data.message ||
        data.errorMessage ||
        data.error ||
        rawText.slice(0, 200) ||
        res.status,
    );
    throw new Error(`Erreur initiation paiement MVola: ${msg}`);
  }

  return {
    server_correlation_id: String(data.serverCorrelationId),
    status: String(data.status || "pending"),
    notification_method: String(data.notificationMethod || ""),
  };
}

//  Verifier le statut

export interface MvolaStatusResult {
  status: string;
  server_correlation_id: string;
  notification_method: string;
  object_reference: string | null;
}

export async function verifierStatut(
  serverCorrelationId: string,
): Promise<MvolaStatusResult> {
  const token = await getAccessToken();
  const correlationId = generateCorrelationId();

  const res = await fetch(
    `${MVOLA_API_URL}/mvola/mm/transactions/type/merchantpay/1.0.0/status/${serverCorrelationId}`,
    {
      method: "GET",
      headers: buildHeadersWithAccount(token, correlationId),
    },
  );

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    logError(
      "MVOLA_STATUS",
      `status=${res.status} message=${String(data.message || "")} serverCorrelationId=${serverCorrelationId}`,
    );
    throw new Error(
      `Erreur verification statut MVola: ${String(data.message || res.status)}`,
    );
  }

  return {
    status: String(data.status || ""),
    server_correlation_id: String(
      data.serverCorrelationId || serverCorrelationId,
    ),
    notification_method: String(data.notificationMethod || ""),
    object_reference: data.objectReference
      ? String(data.objectReference)
      : null,
  };
}

//  Details d'une transaction

export interface MvolaTransactionDetails {
  amount: string;
  currency: string;
  transaction_reference: string;
  transaction_status: string;
  create_date: string;
  debit_msisdn: string;
  credit_msisdn: string;
  fee_amount: string | null;
  original_transaction_result: string | null;
  original_transaction_result_desc: string | null;
}

export async function getTransactionDetails(
  transactionId: string,
): Promise<MvolaTransactionDetails> {
  const token = await getAccessToken();
  const correlationId = generateCorrelationId();

  const res = await fetch(
    `${MVOLA_API_URL}/mvola/mm/transactions/type/merchantpay/1.0.0/${transactionId}`,
    {
      method: "GET",
      headers: buildHeadersWithAccount(token, correlationId),
    },
  );

  const data = (await res.json()) as Record<string, any>;

  if (!res.ok) {
    logError(
      "MVOLA_DETAILS",
      `status=${res.status} transactionId=${transactionId}`,
    );
    throw new Error(
      `Erreur details transaction MVola: ${String(data.message || res.status)}`,
    );
  }

  const metadata = data.metadata || [];
  const fees = data.fees || [];

  return {
    amount: data.amount,
    currency: data.currency,
    transaction_reference: data.transactionReference,
    transaction_status: data.transactionStatus,
    create_date: data.createDate,
    debit_msisdn: data.debitParty?.[0]?.value,
    credit_msisdn: data.creditParty?.[0]?.value,
    fee_amount: fees[0]?.feeAmount || null,
    original_transaction_result:
      metadata.find((m: any) => m.key === "originalTransactionResult")?.value ||
      null,
    original_transaction_result_desc:
      metadata.find((m: any) => m.key === "originalTransactionResultDesc")
        ?.value || null,
  };
}
