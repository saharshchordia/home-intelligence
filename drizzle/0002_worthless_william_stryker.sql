CREATE TABLE `evidence_pins` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`assertion_id` text NOT NULL,
	`media_id` text,
	`zone_id` text,
	`entity_id` text,
	`mode` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`z` real NOT NULL,
	`label` text NOT NULL,
	`confidence` real NOT NULL,
	`status` text NOT NULL,
	`rationale` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spatial_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`entity_id` text,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`zone_type` text NOT NULL,
	`geometry_kind` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`z` real NOT NULL,
	`width` real NOT NULL,
	`height` real NOT NULL,
	`depth` real NOT NULL,
	`color` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
