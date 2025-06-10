package main

import (
	"log"
	"net/http"
)

func main() {
	fs := http.FileServer(http.Dir("../src"))
	http.Handle("/", fs)

	log.Println("Serving on http://localhost:4000")
	err := http.ListenAndServe(":4000", nil)
	if err != nil {
		log.Fatal(err)
	}
}
