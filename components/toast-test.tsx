"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function ToastTest() {
  const { toast } = useToast()

  return (
    <div className="space-y-2">
      <Button
        onClick={() => {
          toast({
            title: "Success!",
            description: "This is a success message.",
          })
        }}
      >
        Show Success Toast
      </Button>

      <Button
        variant="destructive"
        onClick={() => {
          toast({
            variant: "destructive",
            title: "Error!",
            description: "This is an error message.",
          })
        }}
      >
        Show Error Toast
      </Button>
    </div>
  )
}
