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
            return c.html(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Error</title>
                </head>
                <body>
                    <div class="message error">Sorry this link does not exist</div>
                </body>
                </html>
            `)
        } else {
            return Response.redirect(linkFromKV, 307);
        }
    } catch (error) {
        console.error('Error handling redirect:', error);
        return c.html(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Error</title>
            </head>
            <body>
                <div class="message error">An error occurred</div>
            </body>
            </html>
        `, 500);
    }
})

app.post('/submit', async (c) => {
    try {
        const formData = await c.req.formData();

        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        const id = formObject['vanity'];
        const urlInput = formObject['url'];

        const urlValidationMessage = validateURL(urlInput);

        if (urlValidationMessage !== "URL is valid") {
            return c.html(`<div class="message error">${urlValidationMessage}</div>`);
        }

        const idAlreadyExists = await c.env.KV.get(id);

        if (idAlreadyExists !== null) {
            return c.html(`<div class="message error">${id} already exists.</div>`);
        }

        await c.env.KV.put(id, urlInput, { expirationTtl: 3600 });

        const hostname = c.req.url.split('/submit')[0];
        return c.html(`
            <div class="message success">
                ${id} successfully stored! Here is the link: 
                <a href="${hostname}/${id}">${hostname}/${id}</a>
            </div>
        `);
    } catch (error) {
        console.error('Error handling submission:', error);
        return c.html(`<div class="message error">An error occurred</div>`, 500);
    }
});

app.get('/', (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>URL Shortener</title>
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
<style>
	/* Base styles - TempleOS inspired */
	html, body {
		height: 100vh;
		margin: 0;
		padding: 0;
		background-color: #000000;
		font-family: 'Courier New', monospace;
	}

	body {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #FFFFFF;
		padding: 20px;
		box-sizing: border-box;
	}

	/* Container for the form and response */
	.container {
		width: 100%;
		max-width: 800px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 20px;
	}

	/* Form styles */
	form {
		background-color: #000000;
		padding: 30px;
		border: 2px solid #55FFFF;
		width: 100%;
		max-width: 600px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	label {
		display: block;
		margin-bottom: 5px;
		font-weight: bold;
		color: #FFFF55;
		text-transform: uppercase;
		width: 100%;
		text-align: center;
	}

	input[type="text"] {
		width: 90%;
		padding: 8px;
		margin-bottom: 15px;
		border: 2px solid #55FFFF;
		background-color: #000000;
		color: #FFFFFF;
		text-align: center;
		font-family: 'Courier New', monospace;
	}

	input[type="submit"] {
		background-color: #000000;
		color: #55FF55;
		padding: 15px 30px;
		border: 2px solid #55FF55;
		cursor: pointer;
		font-weight: bold;
		text-transform: uppercase;
		font-family: 'Courier New', monospace;
		margin-top: 10px;
	}

	input[type="submit"]:hover {
		background-color: #55FF55;
		color: #000000;
	}

	/* Message styles */
	.message {
		padding: 15px;
		margin: 20px 0;
		width: 100%;
		max-width: 600px;
		border: 2px solid #55FFFF;
		text-align: center;
		box-sizing: border-box;
	}

	.error {
		background-color: #000000;
		color: #FF5555;
		border-color: #FF5555;
	}

	.success {
		background-color: #000000;
		color: #55FF55;
		border-color: #55FF55;
	}
	
	.info-box {
    background-color: #000000;
    color: #FFFF55;
    border: 2px solid #55FFFF;
    padding: 15px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 600px;
    text-align: center;
    box-sizing: border-box;
    font-weight: bold;
	}

	/* Link styles */
	a {
		color: #55FFFF;
		text-decoration: none;
		font-weight: bold;
	}

	a:hover {
		color: #FFFF55;
		text-decoration: underline;
	}

	#response {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
</head>
<body>
    <div class="container">
		<div class="info-box">INFO: ALL URLS EXPIRE IN 1 HOUR</div>
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
    </div>
</body>
</html>
`)
})

export default app