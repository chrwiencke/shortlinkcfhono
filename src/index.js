import { Hono } from 'hono'
const app = new Hono()

app.get('/:id', async (c) => {
	try {
		const id = c.req.param('id')
		const linkFromKV = await c.env.KV.get(id);

		if (!linkFromKV) {
			return c.text("Sorry this link does not exist")
		} else {
			return Response.redirect(linkFromKV, 307);
		}
	} catch (error) {
		console.error('Error handling redirect:', error);
		return c.text('An error occurred', 500);
	}
})

app.post('/submit', async (c) => {
	try {
		const formData = await c.req.formData();

		console.log(1 + "formData")

		const formObject = {};
		formData.forEach((value, key) => {
            formObject[key] = value;
        });

		console.log(2 + "formObject")

		const id = formObject['userInput'];

		console.log(3 + "id")

		const idAlreadyExists = await c.env.KV.get(id)

		console.log(4 + "idAlreadyExists")

		if (idAlreadyExists) {
			return c.text(id + ' Already exists')
		}
		
		await c.env.KV.put(id);

	} catch (error) {
		console.error('Error handling redirect:', error);
		return c.text('An error occurred', 500);
	}
})

app.get('/', (c) => {
    return c.html(
`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Form Submission with htmx</title>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
</head>
<body>
    <form hx-post="/submit" hx-trigger="submit" hx-target="#response">
        <label for="userInput">Enter something:</label>
        <input type="text" id="userInput" name="userInput" required>
        <input type="submit" value="Submit">
    </form>

    <div id="response"></div>
</body>
</html>
`
)
})

export default app