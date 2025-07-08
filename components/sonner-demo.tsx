"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function SonnerDemo() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Toast Notifications</CardTitle>
        <CardDescription>Test the new Sonner toast system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={() => toast.success("Book uploaded successfully!")} className="w-full">
          Success Toast
        </Button>

        <Button onClick={() => toast.error("Failed to delete book")} variant="destructive" className="w-full">
          Error Toast
        </Button>

        <Button onClick={() => toast.info("Processing your request...")} variant="outline" className="w-full">
          Info Toast
        </Button>

        <Button onClick={() => toast.warning("Storage space is running low")} variant="secondary" className="w-full">
          Warning Toast
        </Button>

        <Button
          onClick={() => toast.loading("Uploading file...", { duration: 2000 })}
          variant="outline"
          className="w-full"
        >
          Loading Toast
        </Button>

        <Button
          onClick={() =>
            toast.success("Book created!", {
              description: "The Great Gatsby has been added to your library",
              action: {
                label: "View",
                onClick: () => console.log("View clicked"),
              },
            })
          }
          className="w-full"
        >
          Toast with Action
        </Button>
      </CardContent>
    </Card>
  )
}
