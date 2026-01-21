package db

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(databaseURL string) *DB {
	// Context allows us to set a timeout. If we can't connect in 5 seconds, give up.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	
	// 'defer' schedules this function to run when Connect() returns.
	// It ensures we clean up the timeout timer resources.
	defer cancel()

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("❌ Invalid Database URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Postgres: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("❌ Postgres Ping failed: %v", err)
	}

	log.Println("✅ Connected to Postgres")
	return &DB{Pool: pool}
}