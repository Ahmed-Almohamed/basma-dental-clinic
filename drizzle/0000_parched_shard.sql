CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`patient_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`duration` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_appointments_owner_date` ON `appointments` (`owner`,`date`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`patient_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_files_owner_patient` ON `files` (`owner`,`patient_id`);--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`patient_id` text,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`method` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ledger_owner_date` ON `ledger` (`owner`,`date`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`birth_date` text DEFAULT '' NOT NULL,
	`gender` text DEFAULT '' NOT NULL,
	`allergies` text DEFAULT '' NOT NULL,
	`history` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_patients_owner` ON `patients` (`owner`);--> statement-breakpoint
CREATE TABLE `settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`clinic` text NOT NULL,
	`doctor` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`patient_id` text NOT NULL,
	`tooth` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`cost` integer NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`date` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_treatments_owner_patient` ON `treatments` (`owner`,`patient_id`);