import React from "react";
export default function PageHeader({ title, subtitle, action, mascot }) {
  return (
    <div className="page-header mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-5">
        {mascot ? <div className="header-mascot">{mascot}</div> : null}
        <div>
          <h1 className="font-display text-3xl font-black tracking-normal text-[var(--heading)] sm:text-4xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-[var(--muted)]">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
