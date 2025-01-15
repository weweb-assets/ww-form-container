---
name: ww-form-container
description: A responsive HTML form element that organizes form elements, manages form submissions with a submit event, and offers optional browser autocomplete, while providing workflow guidance by alerting users if a submit button is absent.
keywords:
  - form container
  - html form element
  - form submissions
  - autocomplete
  - formcontent
  - submit event
  - custom form handling
  - workflow hint
  - responsive layout
  - ww-layout inheritance
---

#### ww-form-container

Container for form elements creating a HTML form element to organize and handle form submissions.

Properties:
- autocomplete: boolean - Enables/disables browser autocomplete. Default: true.

Children:
- formContent: Array(any) - Child components rendered inside form container.

Special Features:
- Emits submit event on form submission
- Workflow hint warns if submit button is missing
- Inherits ww-layout component properties

Events:
- submit: Triggered when form is submitted. No payload. Used to handle form submission.

Variables: none
