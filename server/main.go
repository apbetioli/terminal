package main

import "github.com/kataras/iris/v12"

func main() {
	app := iris.New()

	app.HandleDir("/", iris.Dir("../src"))

	print("Listening on http://localhost:4000")

	app.Listen(":4000")
}
