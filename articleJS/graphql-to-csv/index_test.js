const fetch = require('node-fetch');
const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Function to fetch articles
const fetchArticles = async (afterCursor = null) => {
  const graphqlQuery = {
    query: `
      query CHRIResearch($first: Int, $after: String) {
  articles(first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        contentTypeName
        link
        slug
        research {
          researchRocid
          researchMethodology
          researchThcOrCbd
          researchInVivoOrInVitro
          researchAge
          researchActualArticleTitle
          researchHumanOrAnimal
          researchJournal
          researchPublicationYear
          researchAuthors
          researchFullArticle {
            node {
              id
              mediaType
              fileSize
              contentTypeName
              mediaItemUrl
            }
          }
        }
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
`,
    variables: {
      first: 10, // Number of articles to fetch per page
      after: afterCursor // Cursor for articles pagination
    }
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(graphqlQuery)
  };

  try {
    const response = await fetch('https://www.cannabisandhealth.org/graphql', requestOptions);
    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL query error: ${JSON.stringify(data.errors)}`);
    }

    // Check if data.articles is defined
    if (!data.data || !data.data.articles) {
      throw new Error('Articles data is missing in GraphQL response.');
    }

    // Extract articles from GraphQL response
    const articles = data.data.articles.edges.map(edge => edge.node);

    // Prepare articles data for CSV
    const fields = [
      'id',
      'contentTypeName',
      'link',
      'slug',
      'research.researchRocid',
      'research.researchMethodology',
      'research.researchThcOrCbd',
      'research.researchInVivoOrInVitro',
      'research.researchAge',
      'research.researchActualArticleTitle',
      'research.researchHumanOrAnimal',
      'research.researchJournal',
      'research.researchPublicationYear',
      'research.researchAuthors',
      'research.researchFullArticle.node.id',
      'research.researchFullArticle.node.mediaType',
      'research.researchFullArticle.node.fileSize',
      'research.researchFullArticle.node.contentTypeName',
      'research.researchFullArticle.node.mediaItemUrl'
    ];

    const csv = parse(articles, { fields });

    // Append CSV data to file
    const filePath = path.join(process.cwd(), 'articles.csv');
    fs.appendFileSync(filePath, csv, 'utf-8');

    console.log(`Batch of articles appended to: ${filePath}`);

    // Check if there are more pages of articles to fetch
    if (data.data.articles.pageInfo.hasNextPage) {
      const nextCursor = data.data.articles.pageInfo.endCursor;
      await fetchArticles(nextCursor); // Recursively fetch next page of articles
    } else {
      console.log('Articles pagination completed.');
      // After fetching articles, fetch and export keywords and conditions
      await fetchAndExportKeywords();
      await fetchAndExportConditions();
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
};

// Function to fetch and export keywords
const fetchAndExportKeywords = async () => {
  let allKeywords = [];

  const fetchKeywordsPage = async (afterCursor = null) => {
    const graphqlQuery = {
      query: `
        query {
          researchKeywords(first: 100, after: "${afterCursor}") {
            nodes {
              id
              name
              count
              parentId
              parent {
                node {
                  id
                }
              }
              isTermNode
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      `
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    };

    try {
      const response = await fetch('https://www.cannabisandhealth.org/graphql', requestOptions);
      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL query error: ${JSON.stringify(data.errors)}`);
      }

      const keywords = data.data.researchKeywords.nodes;
      allKeywords = [...allKeywords, ...keywords];

      if (data.data.researchKeywords.pageInfo.hasNextPage) {
        const nextCursor = data.data.researchKeywords.pageInfo.endCursor;
        await fetchKeywordsPage(nextCursor); // Recursively fetch next page of keywords
      } else {
        // Export all keywords to CSV
        const fields = [
          'id',
          'name',
          'count',
          'parentId',
          'parent.node.id',
          'isTermNode'
        ];

        const csv = parse(allKeywords, { fields });
        const filePath = path.join(process.cwd(), 'keywords.csv');
        fs.writeFileSync(filePath, csv, 'utf-8');
        console.log(`Keywords exported to: ${filePath}`);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  // Start fetching keywords
  await fetchKeywordsPage();
};

// Function to fetch and export conditions
const fetchAndExportConditions = async () => {
  let allConditions = [];

  const fetchConditionsPage = async (afterCursor = null) => {
    const graphqlQuery = {
      query: `
        query {
          conditions(first: 100, after: "${afterCursor}") {
            nodes {
              id
              name
              count
              parentId
              parent {
                node {
                  id
                }
              }
              isTermNode
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      `
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    };

    try {
      const response = await fetch('https://www.cannabisandhealth.org/graphql', requestOptions);
      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL query error: ${JSON.stringify(data.errors)}`);
      }

      const conditions = data.data.conditions.nodes;
      allConditions = [...allConditions, ...conditions];

      if (data.data.conditions.pageInfo.hasNextPage) {
        const nextCursor = data.data.conditions.pageInfo.endCursor;
        await fetchConditionsPage(nextCursor); // Recursively fetch next page of conditions
      } else {
        // Export all conditions to CSV
        const fields = [
          'id',
          'name',
          'count',
          'parentId',
          'parent.node.id',
          'isTermNode'
        ];

        const csv = parse(allConditions, { fields });
        const filePath = path.join(process.cwd(), 'conditions.csv');
        fs.writeFileSync(filePath, csv, 'utf-8');
        console.log(`Conditions exported to: ${filePath}`);
      }
    } catch (error) {
      console.error('Error fetching conditions:', error);
    }
  };

  // Start fetching conditions
  await fetchConditionsPage();
};

// Start fetching articles
fetchArticles();
