export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-9 h-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">{text}</p>
    </div>
  );
}
