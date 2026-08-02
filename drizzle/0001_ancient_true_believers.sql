CREATE TABLE `assertion_entities` (
	`assertion_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`relationship` text NOT NULL,
	`confidence` real NOT NULL,
	`status` text NOT NULL,
	`rationale` text NOT NULL,
	`reviewed_at` text,
	PRIMARY KEY(`assertion_id`, `entity_id`)
);
--> statement-breakpoint
CREATE TABLE `assertion_evidence` (
	`assertion_id` text NOT NULL,
	`media_id` text NOT NULL,
	PRIMARY KEY(`assertion_id`, `media_id`)
);
--> statement-breakpoint
CREATE TABLE `assertions` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`document_id` text NOT NULL,
	`report_item` text NOT NULL,
	`source_page` integer NOT NULL,
	`section` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`severity` text NOT NULL,
	`temporal_status` text NOT NULL,
	`review_status` text NOT NULL,
	`extraction_confidence` real NOT NULL,
	`entity_confidence` real NOT NULL,
	`temporal_confidence` real NOT NULL,
	`location_rationale` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`title` text NOT NULL,
	`document_type` text NOT NULL,
	`source_date` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`page_count` integer NOT NULL,
	`object_key` text NOT NULL,
	`sha256` text NOT NULL,
	`storage_status` text NOT NULL,
	`visibility` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`label` text NOT NULL,
	`kind` text NOT NULL,
	`source_page` integer NOT NULL,
	`object_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`sha256` text NOT NULL,
	`storage_status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`assertion_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`decision` text NOT NULL,
	`previous_status` text NOT NULL,
	`next_status` text NOT NULL,
	`note` text NOT NULL,
	`decided_at` text NOT NULL
);
