import { useSocketSync } from "../hooks/useSocketSync";

export function SocketBridge() {
  useSocketSync();
  return null;
}
