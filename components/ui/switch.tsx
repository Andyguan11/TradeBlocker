"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ ...props }, ref) => ( // Remove className from destructuring
  <SwitchPrimitives.Root
    className={`${
      props.checked ? 'bg-blue-600' : 'bg-gray-200'
    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={`${
        props.checked ? 'translate-x-6' : 'translate-x-1'
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }