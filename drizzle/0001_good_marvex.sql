CREATE TABLE `sale_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sale_returns_sale` ON `sale_returns` (`sale_id`);--> statement-breakpoint
ALTER TABLE `sale_items` ADD `returned_quantity` integer DEFAULT 0 NOT NULL;