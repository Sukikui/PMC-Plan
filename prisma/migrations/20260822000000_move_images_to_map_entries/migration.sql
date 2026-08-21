ALTER TABLE "map_entries"
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "map_entries" AS "entry"
SET "images" = "place"."images"
FROM "places" AS "place"
WHERE "place"."map_entry_id" = "entry"."id";

ALTER TABLE "places"
DROP COLUMN "images";
