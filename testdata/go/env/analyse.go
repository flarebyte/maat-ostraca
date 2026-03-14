package sample

import "os"

func demo(name string) {
	_ = os.Getenv("DB_HOST")
	_, _ = os.LookupEnv(`API_KEY`)
	_ = os.Getenv("SERVICE_URL")
	_ = os.LookupEnv(name)
	_ = os.Getenv(prefix + "IGNORED")
}
