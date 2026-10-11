ALTER TABLE `appointments` ADD `treatment_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `booking_fingerprint` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `treatments` ADD `cost_known` integer DEFAULT 1 NOT NULL;