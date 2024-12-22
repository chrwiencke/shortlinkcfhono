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

app.post('/:id', async (c) => {
	try {
		const id = c.req.param('id')


		const idAlreadyExists = await c.env.KV.get(id)

		if (idAlreadyExists) {
			return c.text(id + ' Already exists')
		}

		const linkFromKV = await c.env.KV.put(id);

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
    <form hx-post="/" hx-include="[name='userInput']" hx-params="*">
        <label for="userInput">Enter your input:</label>
        <input type="text" id="userInput" name="userInput" required>
        <button type="submit">Submit</button>
    </form>
</body>
</html>
`
)
})

export default app