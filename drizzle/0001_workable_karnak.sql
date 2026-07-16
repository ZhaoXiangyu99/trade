CREATE TABLE `portfolio_config` (
	`id` text PRIMARY KEY NOT NULL,
	`cash_balance` real DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_positions` (
	`ticker` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`asset_class` text NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`average_cost` real DEFAULT 0 NOT NULL,
	`current_price` real DEFAULT 0 NOT NULL,
	`target_weight` real DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `portfolio_positions_asset_class_idx` ON `portfolio_positions` (`asset_class`);