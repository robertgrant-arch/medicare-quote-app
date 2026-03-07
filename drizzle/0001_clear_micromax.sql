CREATE TABLE `carrier_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carrierName` varchar(128) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(128),
	CONSTRAINT `carrier_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `carrier_overrides_carrierName_unique` UNIQUE(`carrierName`)
);
--> statement-breakpoint
CREATE TABLE `cms_data_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`url` text NOT NULL,
	`category` enum('landscape','pbp','star_ratings','enrollment','service_area') NOT NULL,
	`lastFileHash` varchar(64),
	`lastCheckedAt` timestamp,
	`lastUpdatedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cms_data_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triggerType` enum('scheduled','manual') NOT NULL,
	`status` enum('running','success','partial','error') NOT NULL,
	`sourcesChecked` int NOT NULL DEFAULT 0,
	`sourcesUpdated` int NOT NULL DEFAULT 0,
	`plansProcessed` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`detailLog` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `cms_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(64) NOT NULL,
	`planName` varchar(256),
	`carrierName` varchar(128),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`isNonCommissionable` boolean NOT NULL DEFAULT false,
	`nonCommSource` text,
	`nonCommEffectiveDate` varchar(32),
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(128),
	CONSTRAINT `plan_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_overrides_planId_unique` UNIQUE(`planId`)
);
