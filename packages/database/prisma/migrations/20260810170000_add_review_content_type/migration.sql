-- Synthetic GBP reviews are persisted as untrusted content, not instructions.
ALTER TYPE "ContentItemType" ADD VALUE 'REVIEW';
