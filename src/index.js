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

        // Convert FormData to an object
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        console.log("Form Data Object:", formObject);

        const id = formObject['vanity']; // Use the 'vanity' field as the key
        const url = formObject['url'];   // Use the 'url' field as the value

        console.log("Vanity ID:", id);
        console.log("URL:", url);

        // Check if the key already exists
        const idAlreadyExists = await c.env.KV.get(id);

        if (idAlreadyExists) {
			console.log("ID Already Exits:", idAlreadyExists);
            return c.text(`${id} already exists`, 409); // Conflict
        }

        // Store the key-value pair
        await c.env.KV.put(id, url); // Store 'url' as the value

        return c.text(`${id} successfully stored!`, 201); // Created
    } catch (error) {
        console.error('Error handling redirect:', error);
        return c.text('An error occurred', 500);
    }
});

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
    <form hx-post="/submit" hx-trigger="submit" hx-target="#response" hx-swap="innerHTML">
        <label for="vanity">Vanity:</label>
        <input type="text" id="vanity" name="vanity" required>
        <br>
        <label for="url">URL:</label>
        <input type="text" id="url" name="url" required>
        <br>
        <input type="submit" value="Submit">
    </form>

    <div id="response"></div>
</body>

</html>
`
)
})

export default app