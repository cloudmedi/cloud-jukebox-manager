"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className="relative h-4 sm:h-2 w-full grow overflow-hidden rounded-full bg-muted"
    >
      <SliderPrimitive.Range 
        className="absolute h-full bg-primary shadow-lg shadow-primary/20 transition-all duration-200" 
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-8 w-8 sm:h-6 sm:w-6 rounded-full border-4 border-primary bg-background ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:border-primary/80 active:scale-95" 
    />
  </SliderPrimitive.Root>
))

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }