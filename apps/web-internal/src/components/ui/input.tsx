import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-cyan-50 placeholder:text-cyan-400/50 selection:bg-cyan-500/30 selection:text-cyan-50 border-cyan-500/30 flex h-9 w-full min-w-0 rounded-md border bg-black/50 px-3 py-1 text-base text-cyan-50 shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-cyan-400 focus-visible:ring-cyan-400/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
