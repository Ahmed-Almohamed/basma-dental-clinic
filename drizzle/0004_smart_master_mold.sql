CREATE TABLE `file_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_file_chunks_file` ON `file_chunks` (`file_id`,`chunk_index`);