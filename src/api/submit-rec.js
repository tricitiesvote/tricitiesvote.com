const { Octokit } = require("@octokit/core");
const { createPullRequest } = require("octokit-plugin-create-pull-request");
const { token, apiKey, domain } = require("./_config");
const slugify = require("slugify");
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const OctokitClient = Octokit.plugin(createPullRequest);
const octokit = new OctokitClient({ auth: token });

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: "api", key: apiKey });

exports.handler = async (event) => {
	// only allow POST
	try {
		if (event.httpMethod !== "POST") {
			return {
				statusCode: 405,
				body: JSON.stringify({ error: "Method not allowed" }),
				headers: { Allow: "POST" },
			};
		}

		const { authorization } = event.headers;
		if (!authorization) {
			return {
				statusCode: 401,
				body: JSON.stringify({ error: "Authorization failed" }),
			};
		}
		const { success } = await verify(
			authorization
		);
		if (!success) {
			return {
				statusCode: 401,
				body: JSON.stringify({ error: "Authorization failed" }),
			};
		}

		const data = JSON.parse(event.body);
		
		let { candidate, endorser, url, type, submitterEmail } = data;

		// ensure we have the data we need
		if (!candidate) {
			return {
				statusCode: 422,
				body: JSON.stringify({ error: "Candidate is required" }),
			};
		}
		
		if (!endorser) {
			return {
				statusCode: 422,
				body: JSON.stringify({ error: "Endorser is required" }),
			};
		}

		if (!url) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					error:
						"Please provide a public link to this endorsement's letter.",
				}),
			};
		}
		
		if (!type) {
			return {
				statusCode: 422,
				body: JSON.stringify({ error: "Please select the type of endorsement" }),
			};
		}
		
		if (!submitterEmail) {
			return {
				statusCode: 422,
				body: JSON.stringify({ error: "Your email address is required in case we need to reach out because of an issue with your submission." }),
			};
		}
		
		let slug = slugify(`${endorser}-for-${candidate}`)
		const endorsementData = { candidate, endorser, url, type };

		const files = {
			[`data/endorsements/${slug}.json`]: JSON.stringify(
				endorsementData,
				null,
				2
			),
		};

		const body = `Auto-generated PR for new endorsement by ${endorser}\n\nSubmitted by ${submitterEmail}`;

		try {
			const res = await octokit.createPullRequest({
				owner: "tumbleweird",
				repo: "tricitiesvote.com",
				title: `Add endorsement by ${endorser}`,
				body,
				head: `endorsement-${slug}`,
				changes: [
					{
						files,
						commit: `endorsement ${slug}`,
					},
				],
			});
			
			const prLink = `https://github.com/tumbleweird/tricitiesvote.com/pull/${res.data.number}`
			const recipient = `${email}`;
			
			const text = dedent`
			Thank you for helping add data to Tri-Cities Vote!
			
			The endorsement you provided has been submitted for review:
			
			Endorser: ${endorser}
			Candidate ID: ${candidate} 
			URL: ${url}
			
			You can check the status of this submission at ${prLink}
			
			The tricitiesvote.com site is open source code. The link above is a publicly viewable request to add your submitted data to the site. When your submission has been accepted, the provided link will show as merged. 
			
			The submission process requires a manual review by a volunteer, so please be patient.
			`;
			
			const emailData = {
				from: "endorsements@triciti.es",
				to: recipient,
				subject: `Tri-Cities Vote: ${endorser} endorsement`,
				text,
			};
			
			return mg.messages
			.create(domain, emailData)
			.then(() => {
				return {
					statusCode: 200,
					body: "Endorsement submitted successfully and confirmation email sent.",
				};
			})
			.catch((err) => {
				return {
					statusCode: err.status || 500,
					body: JSON.stringify({ error: err.message || err }),
				};
			});

			return {
				statusCode: 201,
				body: JSON.stringify({ message: `Created PR ${res.data.number}` }),
			};
		} catch (err) {
			return {
				statusCode: err.response.status,
				body: JSON.stringify({ error: err.response.data.message.toString() }),
			};
		}
	} catch (err) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Internal server error." }),
		};
	}
};