// Script to set up Supabase storage buckets and policies
const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    console.log("Setting up Supabase storage...")

    // Create the audiobooks bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket("audiobooks", {
      public: true,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/m4a",
        "audio/ogg",
      ],
      fileSizeLimit: 104857600, // 100MB
    })

    if (bucketError && bucketError.message !== "Bucket already exists") {
      throw bucketError
    }

    console.log("✅ Audiobooks bucket created/verified")

    // Set up RLS policies for the bucket
    const policies = [
      {
        name: "Allow public read access",
        definition: "true",
        check: null,
        command: "SELECT",
      },
      {
        name: "Allow authenticated upload",
        definition: "auth.role() = 'authenticated'",
        check: null,
        command: "INSERT",
      },
      {
        name: "Allow authenticated update",
        definition: "auth.role() = 'authenticated'",
        check: null,
        command: "UPDATE",
      },
      {
        name: "Allow authenticated delete",
        definition: "auth.role() = 'authenticated'",
        check: null,
        command: "DELETE",
      },
    ]

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc("create_storage_policy", {
        bucket_name: "audiobooks",
        policy_name: policy.name,
        definition: policy.definition,
        check_expression: policy.check,
        command: policy.command,
      })

      if (policyError && !policyError.message.includes("already exists")) {
        console.warn(`Policy warning for "${policy.name}":`, policyError.message)
      }
    }

    console.log("✅ Storage policies configured")
    console.log("🎉 Supabase storage setup complete!")
  } catch (error) {
    console.error("❌ Setup failed:", error)
    process.exit(1)
  }
}

setupStorage()
