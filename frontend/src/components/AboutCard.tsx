export type AboutCardType = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export const AboutCard = ({ icon, title, desc }: AboutCardType) => {
  return (
    <div className="bg-gray-200 p-4 2xl:p-12 rounded border border-black/10 shadow-md space-y-4 hover:-translate-y-2 transition duration-300 cursor-pointer">
      <div className="bg-white flex items-center justify-center p-2 size-max rounded">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-black/60">{desc}</p>
    </div>
  );
};
