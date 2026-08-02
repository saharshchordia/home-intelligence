CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`group_name` text NOT NULL,
	`condition` text NOT NULL,
	`detail` text NOT NULL,
	`source_page` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_evidence` (
	`event_id` text NOT NULL,
	`evidence_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_tags` (
	`event_id` text NOT NULL,
	`entity_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`condition_before` text,
	`condition_after` text,
	`cost_cents` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`label` text NOT NULL,
	`kind` text NOT NULL,
	`source_ref` text NOT NULL,
	`captured_at` text NOT NULL,
	`visibility` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `homes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`acquired_at` text NOT NULL,
	`year_built` integer NOT NULL,
	`design` text NOT NULL,
	`living_area_sq_ft` integer NOT NULL,
	`lot_sq_ft` integer NOT NULL,
	`room_count` integer NOT NULL,
	`bedrooms` integer NOT NULL,
	`bathrooms` integer NOT NULL,
	`quality_rating` text NOT NULL,
	`condition_rating` text NOT NULL,
	`source_label` text NOT NULL,
	`source_date` text NOT NULL
);
