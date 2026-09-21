import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f0] via-[#ffe9e3] to-[#e8e4dd] px-6">
      <div className="max-w-md w-full text-center py-16">
        <div className="text-6xl mb-6">📦👋</div>
        <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
          New city?
          <br />
          Everybody&apos;s in the same boat.
        </h1>
        <p className="mt-4 text-[15px] text-sub leading-relaxed">
          FirstFriend matches you into a small group of people who just moved
          here too — and gets you to a real meetup within a week.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login?path=here"
            className="block w-full py-4 rounded-2xl bg-coral text-white font-bold text-[16px] active:scale-[0.97] transition-transform"
          >
            I just moved here
          </Link>
          <Link
            href="/login?path=soon"
            className="block w-full py-3 rounded-2xl text-sub font-semibold"
          >
            Moving soon
          </Link>
        </div>
      </div>
    </div>
  );
}
