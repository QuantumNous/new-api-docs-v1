# Ensure bun and node are discoverable in non-interactive shells (e.g. IDE run configs).
export PATH := $(PATH):$(HOME)/.bun/bin:$(HOME)/.local/bin:/opt/homebrew/bin:/usr/local/bin
BUN ?= $(or $(shell PATH="$(PATH)" command -v bun),$(HOME)/.bun/bin/bun)

.DEFAULT_GOAL := help
.PHONY: help install dev build start format format-check test

help:
	@echo "make install       Install dependencies with bun"
	@echo "make dev           Start Next.js dev server (default :3000, override with PORT=<port>)"
	@echo "make build         Build production site"
	@echo "make start         Start production server (default :3000, override with PORT=<port>)"
	@echo "make format        Format files with Prettier"
	@echo "make format-check  Check formatting with Prettier"
	@echo "make test          Run plugin unit tests"

install:
	$(BUN) install

dev:
	@test -d node_modules || $(BUN) install
	$(if $(PORT),PORT=$(PORT) ,)$(BUN) run dev

build:
	@test -d node_modules || $(BUN) install
	$(BUN) run build

start:
	$(if $(PORT),PORT=$(PORT) ,)$(BUN) run start

format:
	$(BUN) run format

format-check:
	$(BUN) run format:check

test:
	$(BUN) run test:plugins
