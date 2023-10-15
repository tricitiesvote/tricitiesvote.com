import React, { useCallback, useState, useRef } from "react";
import { graphql, Link } from "gatsby";
import DefaultLayout from "../layouts/DefaultLayout";

const initialState = {
	candidate: "",
	endorser: "",
	type: "letter",
	url: "",
	submitterEmail: ""
};

const FormStatus = {
	Unsubmitted: "unsubmitted",
	Submitting: "submitting",
	Submitted: "submitted",
	Error: "error",
};

// const EndorsementForm = ({ data }) => {
const EndorsementForm = ({ handles }) => {	
	const [state, setState] = useState(initialState);
	const [status, setStatus] = useState(FormStatus.Unsubmitted);
	const [errorMessage, setErrorMessage] = useState("");

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setState((state) => {
			return { ...state, [name]: value };
		});
	}, []);

	const submitEndorsement = useCallback(() => {
		const url = `/api/submit-rec`;
		(async () => {
			setStatus(FormStatus.Submitting);
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					handle: state.handle,
					link: state.link,
				}),
			});
			if (response.ok) {
				setStatus(FormStatus.Submitted);
			} else {
				setStatus(FormStatus.Error);
				try {
					const res = await response.json();
					updateErrorMessage(res.error);
				} catch (err) {
					setErrorMessage("");
				}
			}
		})();
	}, [state.candidate, state.endorser, state.url, state.type, state.submitterEmail]);

	const updateErrorMessage = (message) => {
		if (!message) {
			setErrorMessage("");
		} else {
			setErrorMessage(message);
		}
	};

	return (
		<div className="endorsement">
			{(status === FormStatus.Unsubmitted ||
				status === FormStatus.Submitting) && (
				<form>
					<div>
						<label htmlFor="candidate">
							Candidate name
						</label>
						<input
							type="text"
							id="candidate"
							name="candidate"
							placeholder="Firsty McLasterson"
							value={state.candidate}
							onChange={handleChange}
							maxLength={50}
						/>
					</div>
					<div>
						<label htmlFor="endorser">
							Name of endorsing person or organization
						</label>
						<input
							type="text"
							id="endorser"
							name="endorser"
							placeholder="Endorsing McGee"
							value={state.endorser}
							onChange={handleChange}
							maxLength={50}
						/>
					</div>
					<div>
						<label htmlFor="type">
							Name of endorsing person or organization
						</label>
						<select
							id="type"
							name="type"
							value={state.type}
							onChange={handleChange}
							maxLength={50}
						>
							<option value="personal">Personal endorsement</option>
							<option value="org">Organizational endorsement</option>
							<option value="political">Political endorsement</option>
						</select>
					</div>
					<div>
						<label htmlFor="url">
							Link to endorsement
						</label>
						<p>
							We require links to written public endorsements and letters. If you have a PDF rather than a link, upload it to Google Drive or Dropbox and provide a public link to the file.
						</p>
						<input
							type="text"
							id="url"
							name="url"
							placeholder="https://example.com"
							value={state.url}
							onChange={handleChange}
						/>
					</div>
					<div>
						<label htmlFor="submitterEmail">
							Your email
						</label>
						<p>Your email will not be listed on the site but will be shown in the public history of the open source site. This email is only used to (a) receive followup questions from us in case there are any issues with the information you provide, and (b) deliver you an email confirmation of your successful submission of this form.</p> 
						<input
							type="text"
							id="submitterEmail"
							name="submitterEmail"
							placeholder="your_email@aol.com"
							value={state.submitterEmail}
							onChange={handleChange}
							maxLength={100}
						/>
					</div>
					<button
						className="button cta-button centered"
						type="button"
						onClick={submitEndorsement}
						disabled={
							status !== "unsubmitted" ||
							state.candidate === "" ||
							state.endorser === "" ||
							state.url === "" ||
							state.type === "" ||
							state.submitterEmail === ""
						}
					>
						{status === FormStatus.Unsubmitted
							? "Submit Endorsement"
							: "Submitting..."}
					</button>
				</form>
			)}
			{status === FormStatus.Error && (
				<div style={{ textAlign: "center" }}>
					<h1>Whoops!</h1>
					<p>An error occurred while attempting to submit your endorsement.</p>
					{errorMessage !== "" && (
						<p>
							<small>{errorMessage}</small>
						</p>
					)}
				</div>
			)}
			{status === FormStatus.Submitted && (
				<div className="centered-text">
					<h1>Thank you!</h1>
					<p>This endorsement has been submitted for review.</p>
					<p><Link to="/endorsements">Submit another endorsement</Link>.</p>
				</div>
			)}
		</div>
	);
};

export default function WardenRegistration({ data }) {
	// const handles = new Set(data.allHandlesJson.edges.map((h) => h.node.handle));

	return (
		<DefaultLayout pageTitle="Submit Endorsement | Tri-Cities Vote">
			<div className="wrapper-main">
				<h1>Submit an Endorsement</h1>
				<EndorsementForm />
			</div>
		</DefaultLayout>
	);
}

// export const query = graphql`
// 	query {
// 		allHandlesJson(sort: { fields: handle, order: ASC }) {
// 			edges {
// 				node {
// 					handle
// 				}
// 			}
// 		}
// 	}
// `;