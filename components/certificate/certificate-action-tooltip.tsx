"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, X } from "lucide-react"

interface ActionItem {
  label: string
  included: boolean
}

interface CertificateActionTooltipProps {
  children: React.ReactNode
  actions: ActionItem[]
  title: string
}

export function CertificateActionTooltip({
  children,
  actions,
  title,
}: CertificateActionTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        sideOffset={8}
        alignOffset={20}
        className="bg-white border border-gray-200 shadow-xl rounded-xl p-0 w-70 z-50"
      >
        <div className="p-4 space-y-3">
          <h4 
            className="font-semibold text-sm leading-tight"
            style={{ color: '#2596be' }}
          >
            {title}
          </h4>
          
          <div className="space-y-2.5">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5"
              >
                <div className="shrink-0 mt-0.5">
                  {action.included ? (
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#2596be' }}
                    >
                      <Check className="w-3 h-3 text-white stroke-3" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-3 h-3 text-white stroke-3" />
                    </div>
                  )}
                </div>
                <p 
                  className={`text-xs leading-relaxed ${
                    action.included 
                      ? 'text-gray-700 font-medium' 
                      : 'text-red-600 font-medium'
                  }`}
                >
                  {action.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
