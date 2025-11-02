import { DefaultSession } from "next-auth"
import type { Role } from "@prisma/client"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AdapterUser } from "@auth/core/adapters"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      username?: string
      globalName?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    username?: string | null
    globalName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    username?: string
    globalName?: string
    picture?: string
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role
  }
}
