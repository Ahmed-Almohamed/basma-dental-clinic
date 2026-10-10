ALTER TABLE `appointments` ADD `queue_order` integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `completion_outcome` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `completed_at` text DEFAULT '' NOT NULL;