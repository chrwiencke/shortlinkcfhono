import { Hono } from 'hono'
const app = new Hono()

function validateURL(url) {
    if (!/^https?:\/\//.test(url)) {
        return "No http/https in URL";
    }
    if (!/^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(url)) {
        return "Invalid domain format";
    }
    return "URL is valid";
}

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

        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        console.log("Form Data Object:", formObject);

        const id = formObject['vanity'];
        const urlInput = formObject['url'];

        console.log("Vanity ID:", id);
        console.log("URL Input:", urlInput);

        const urlValidationMessage = validateURL(urlInput);

        if (urlValidationMessage !== "URL is valid") {
            return c.text(urlValidationMessage);
        }

        const idAlreadyExists = await c.env.KV.get(id);

        if (idAlreadyExists !== null) {
            console.log("ID Already Exists:", idAlreadyExists);
            return c.text(`${id} already exists.`);
        }

        await c.env.KV.put(id, urlInput, { expirationTtl: 3600 });

        console.log(`Stored ${id}: ${urlInput}`);

        const hostname = c.req.url.split('/submit')[0];
        return c.text(`${id} successfully stored! Here is the link: ${hostname}/${id}`);
    } catch (error) {
        console.error('Error handling submission:', error);
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
    <form hx-post="/submit" 
		hx-trigger="submit" 
		hx-target="#response" 
		hx-swap="innerHTML">
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