const fetch = require('node-fetch');
const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');

// Function to fetch conditions
const fetchConditionsPage = async (cursor = null) => {
  const graphqlQuery = {
    query: `
      query {
        conditions(first: 100, after: "${cursor}") {
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

  try {
    const response = await fetch('https://www.cannabisandhealth.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery),
    });

    const data = await response.json();
    const conditions = data.data.conditions.nodes;

    if (data.data.conditions.pageInfo.hasNextPage) {
      const nextCursor = data.data.conditions.pageInfo.endCursor;
      await fetchConditionsPage(nextCursor);
    } else {
      const fields = ['id', 'name', 'count', 'parentId', 'parent.node.id', 'isTermNode'];
      const csv = parse(conditions, { fields });
      const filePath = path.join(process.cwd(), 'conditions.csv');
      fs.writeFileSync(filePath, csv, 'utf-8');
      console.log(`Conditions exported to: ${filePath}`);
    }
  } catch (error) {
    console.error('Error fetching conditions:', error);
  }
};

// Function to fetch keywords
const fetchKeywordsPage = async (cursor = null) => {
  const graphqlQuery = {
    query: `
      query {
        researchKeywords(first: 100, after: "${cursor}") {
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

  try {
    const response = await fetch('https://www.cannabisandhealth.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery),
    });

    const data = await response.json();
    const keywords = data.data.researchKeywords.nodes;

    if (data.data.researchKeywords.pageInfo.hasNextPage) {
      const nextCursor = data.data.researchKeywords.pageInfo.endCursor;
      await fetchKeywordsPage(nextCursor);
    } else {
      const fields = ['id', 'name', 'count', 'parentId', 'parent.node.id', 'isTermNode'];
      const csv = parse(keywords, { fields });
      const filePath = path.join(process.cwd(), 'keywords.csv');
      fs.writeFileSync(filePath, csv, 'utf-8');
      console.log(`Keywords exported to: ${filePath}`);
    }
  } catch (error) {
    console.error('Error fetching keywords:', error);
  }
};

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
                    Published
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
    variables: { first: 10, after: afterCursor }
  };

  try {
    const response = await fetch('https://www.cannabisandhealth.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery)
    });

    const data = await response.json();
    const articles = data.data.articles.edges.map(edge => edge.node);

    const fields = [
      'id', 'contentTypeName', 'link', 'slug', 'research.researchRocid',
      'research.researchMethodology', 'research.researchThcOrCbd', 'research.researchInVivoOrInVitro',
      'research.researchAge', 'research.researchActualArticleTitle', 'research.researchHumanOrAnimal',
      'research.researchJournal', 'research.researchPublicationYear', 'research.researchAuthors',
      'research.researchFullArticle.node.id', 'research.researchFullArticle.node.mediaType',
      'research.researchFullArticle.node.fileSize', 'research.researchFullArticle.node.contentTypeName',
      'research.researchFullArticle.node.mediaItemUrl'
    ];

    const csv = parse(articles, { fields });
    const filePath = path.join(process.cwd(), 'articles.csv');
    fs.appendFileSync(filePath, csv, 'utf-8');
    console.log(`Batch of articles appended to: ${filePath}`);

    if (data.data.articles.pageInfo.hasNextPage) {
      const nextCursor = data.data.articles.pageInfo.endCursor;
      await fetchArticles(nextCursor);
    } else {
      console.log('Articles pagination completed.');
      await fetchConditionsPage();
      await fetchKeywordsPage();
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
};

fetchArticles();
