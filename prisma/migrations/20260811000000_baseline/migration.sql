-- CreateEnum
CREATE TYPE "World" AS ENUM ('overworld', 'nether');

-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('construction', 'commerce', 'zone_communautaire', 'ferme');

-- CreateEnum
CREATE TYPE "SpaceLogoBackground" AS ENUM ('color', 'transparent');

-- CreateEnum
CREATE TYPE "ServiceContactType" AS ENUM ('none', 'primary_manager', 'custom');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('pending', 'user', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "TradeItemType" AS ENUM ('gives', 'wants');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "discord_id" TEXT NOT NULL,
    "discord_username" TEXT NOT NULL,
    "discord_display_name" TEXT,
    "discord_avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "automatic_user_approval" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minecraft_link_requests" (
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT,
    "expires_at" TIMESTAMP(3),
    "minecraft_uuid" TEXT,
    "minecraft_name" TEXT,
    "validated_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minecraft_link_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "minecraft_profiles" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linked_user_id" TEXT,
    "linked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minecraft_profiles_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "map_entries" (
    "id" TEXT NOT NULL,
    "space_id" TEXT,
    "primary_manager_id" TEXT NOT NULL,
    "last_editor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_entry_managers" (
    "map_entry_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "map_entry_managers_pkey" PRIMARY KEY ("map_entry_id","user_id")
);

-- CreateTable
CREATE TABLE "map_entry_owners" (
    "map_entry_id" TEXT NOT NULL,
    "profile_uuid" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "map_entry_owners_pkey" PRIMARY KEY ("map_entry_id","profile_uuid")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "logo_url" TEXT,
    "logo_zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "logo_background" "SpaceLogoBackground" NOT NULL DEFAULT 'color',
    "discord_url" TEXT,
    "primary_manager_id" TEXT NOT NULL,
    "last_editor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_managers" (
    "space_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_managers_pkey" PRIMARY KEY ("space_id","user_id")
);

-- CreateTable
CREATE TABLE "places" (
    "uid" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "world" "World" NOT NULL,
    "coord_x" INTEGER NOT NULL,
    "coord_y" INTEGER NOT NULL,
    "coord_z" INTEGER NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "category" "PlaceCategory" NOT NULL DEFAULT 'construction',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "discord_url" TEXT,
    "map_entry_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "trade_offers" (
    "uid" TEXT NOT NULL,
    "place_uid" TEXT NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_offers_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "portals" (
    "uid" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "world" "World" NOT NULL,
    "coord_x" INTEGER NOT NULL,
    "coord_y" INTEGER NOT NULL,
    "coord_z" INTEGER NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "map_entry_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portals_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "services" (
    "uid" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact_type" "ServiceContactType" NOT NULL DEFAULT 'none',
    "discord_url" TEXT,
    "illustration_item_id" TEXT,
    "payment_item_id" TEXT,
    "payment_description" TEXT,
    "map_entry_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "trade_items" (
    "uid" TEXT NOT NULL,
    "offer_uid" TEXT NOT NULL,
    "kind" "TradeItemType" NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "enchanted" BOOLEAN NOT NULL DEFAULT false,
    "custom_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "users"("discord_id");

-- CreateIndex
CREATE INDEX "minecraft_link_requests_user_id_created_at_idx" ON "minecraft_link_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "minecraft_link_requests_code_validated_at_expired_at_create_idx" ON "minecraft_link_requests"("code", "validated_at", "expired_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "minecraft_profiles_linked_user_id_key" ON "minecraft_profiles"("linked_user_id");

-- CreateIndex
CREATE INDEX "map_entries_primary_manager_id_idx" ON "map_entries"("primary_manager_id");

-- CreateIndex
CREATE INDEX "map_entries_last_editor_id_idx" ON "map_entries"("last_editor_id");

-- CreateIndex
CREATE INDEX "map_entries_space_id_idx" ON "map_entries"("space_id");

-- CreateIndex
CREATE INDEX "map_entries_updated_at_idx" ON "map_entries"("updated_at");

-- CreateIndex
CREATE INDEX "map_entry_managers_user_id_idx" ON "map_entry_managers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "map_entry_owners_map_entry_id_position_key" ON "map_entry_owners"("map_entry_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "spaces_slug_key" ON "spaces"("slug");

-- CreateIndex
CREATE INDEX "spaces_primary_manager_id_idx" ON "spaces"("primary_manager_id");

-- CreateIndex
CREATE INDEX "spaces_last_editor_id_idx" ON "spaces"("last_editor_id");

-- CreateIndex
CREATE INDEX "spaces_updated_at_idx" ON "spaces"("updated_at");

-- CreateIndex
CREATE INDEX "space_managers_user_id_idx" ON "space_managers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "places_map_entry_id_key" ON "places"("map_entry_id");

-- CreateIndex
CREATE INDEX "places_world_idx" ON "places"("world");

-- CreateIndex
CREATE INDEX "trade_offers_place_uid_idx" ON "trade_offers"("place_uid");

-- CreateIndex
CREATE INDEX "portals_map_entry_id_idx" ON "portals"("map_entry_id");

-- CreateIndex
CREATE INDEX "portals_world_idx" ON "portals"("world");

-- CreateIndex
CREATE UNIQUE INDEX "portals_slug_world_key" ON "portals"("slug", "world");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_map_entry_id_key" ON "services"("map_entry_id");

-- CreateIndex
CREATE INDEX "services_contact_type_idx" ON "services"("contact_type");

-- CreateIndex
CREATE INDEX "trade_items_offer_uid_kind_idx" ON "trade_items"("offer_uid", "kind");

-- AddForeignKey
ALTER TABLE "minecraft_link_requests" ADD CONSTRAINT "minecraft_link_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minecraft_profiles" ADD CONSTRAINT "minecraft_profiles_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entries" ADD CONSTRAINT "map_entries_primary_manager_id_fkey" FOREIGN KEY ("primary_manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entries" ADD CONSTRAINT "map_entries_last_editor_id_fkey" FOREIGN KEY ("last_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entries" ADD CONSTRAINT "map_entries_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entry_managers" ADD CONSTRAINT "map_entry_managers_map_entry_id_fkey" FOREIGN KEY ("map_entry_id") REFERENCES "map_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entry_managers" ADD CONSTRAINT "map_entry_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entry_owners" ADD CONSTRAINT "map_entry_owners_map_entry_id_fkey" FOREIGN KEY ("map_entry_id") REFERENCES "map_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_entry_owners" ADD CONSTRAINT "map_entry_owners_profile_uuid_fkey" FOREIGN KEY ("profile_uuid") REFERENCES "minecraft_profiles"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_primary_manager_id_fkey" FOREIGN KEY ("primary_manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_last_editor_id_fkey" FOREIGN KEY ("last_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_managers" ADD CONSTRAINT "space_managers_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_managers" ADD CONSTRAINT "space_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_map_entry_id_fkey" FOREIGN KEY ("map_entry_id") REFERENCES "map_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_place_uid_fkey" FOREIGN KEY ("place_uid") REFERENCES "places"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portals" ADD CONSTRAINT "portals_map_entry_id_fkey" FOREIGN KEY ("map_entry_id") REFERENCES "map_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_map_entry_id_fkey" FOREIGN KEY ("map_entry_id") REFERENCES "map_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_offer_uid_fkey" FOREIGN KEY ("offer_uid") REFERENCES "trade_offers"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
