CREATE TABLE `investor_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`weekly_notes` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trade_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`ticker` text NOT NULL,
	`action` text NOT NULL,
	`size` text NOT NULL,
	`price` text DEFAULT '' NOT NULL,
	`thesis` text NOT NULL,
	`valuation` text NOT NULL,
	`risk` text NOT NULL,
	`invalidation` text NOT NULL,
	`gates` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trade_entries_date_idx` ON `trade_entries` (`date`);