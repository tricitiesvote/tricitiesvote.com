const remark = require('remark');
const remarkHTML = require('remark-html');
const truncate = require('truncate-html');

exports.onCreateNode = helpers => {
  // console.log(helpers);

  const { node, actions } = helpers;

  const { createNodeField } = actions;
  const markdownFields = [
    {
      name: 'lettersyes',
      data: node.lettersyes,
      wrap: false,
      excerpt: false,
    },
    {
      name: 'lettersno',
      data: node.lettersno,
      wrap: false,
      excerpt: false,
    },
    {
      name: 'articles',
      data: node.articles,
      wrap: true,
      excerpt: false,
    },
    {
      name: 'engagement',
      data: node.engagement,
      wrap: true,
      excerpt: false,
    },
    {
      name: 'bio',
      data: node.bio,
      wrap: true,
      excerpt: 160,
    },
    {
      name: 'statement',
      data: node.statement,
      wrap: true,
      excerpt: 240,
    },
    {
      name: 'body',
      data: node.body,
      wrap: true,
      excerpt: 240,
    },
    {
      name: 'notes',
      data: node.notes,
      wrap: true,
      excerpt: 240,
    },
  ];

  markdownFields.forEach((item, key) => {
    const fieldName = markdownFields[key].name;
    const fieldData = markdownFields[key].data;
    const { wrap } = markdownFields[key];
    const { excerpt } = markdownFields[key];

    // console.log(excerpt)

    // console.log(fieldData);

    if (fieldData) {
      // console.log('hi');
      const wrapValue = remark()
        .use(remarkHTML)
        .processSync(fieldData)
        .toString();

      const noWrapValue = remark()
        .use(remarkHTML)
        .processSync(fieldData)
        .toString()
        .slice(3)
        .slice(0, -5); // remove <p> and </p>

      if (wrap) {
        // create new node at:
        // fields { fieldName_html }
        // console.log('wrap', fieldName, wrapValue);
        createNodeField({
          name: `${fieldName}_html`,
          node,
          value: wrapValue,
        });
      }

      if (!wrap) {
        // create new unwrapped node at:
        // fields { fieldName_html_nowrap }
        // console.log('nowrap', fieldName, noWrapValue);
        createNodeField({
          name: `${fieldName}_html_nowrap`,
          node,
          value: noWrapValue,
        });
      }

      // console.log(excerpt)

      if (excerpt > 0) {
        const excerptValue = truncate(wrapValue, excerpt, {
          reserveLastWord: true,
        });
        // create new node at:
        // fields { fieldName_excerpt_html }
        createNodeField({
          name: `${fieldName}_excerpt_html`,
          node,
          // value: 'hi'
          value: excerptValue,
        });
      }
    }
  });
};
