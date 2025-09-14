const fetch = require('node-fetch');
const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const USERNAME = 'ArticleNames';
const PASSWORD = '$P$BXibrhm/JxTCok2yck0PQeeRJeQi7u.';
const HOSTNAME = 'https://realmofcaring.org/';

const verifyUser = async () => {
  const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const requestOptions = {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(HOSTNAME, requestOptions);
    if (!response.ok) {
      throw new Error(`Verification failed with status: ${response.status}`);
    }
    console.log('User verification successful');
    return true;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
};

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
              researchKeywords {
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
              }
              conditions {
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
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }`,
    variables: {
      first: 10, // Number of items to fetch per page
      after: afterCursor // Cursor for pagination
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

    // Handle GraphQL errors
    if (data.errors) {
      throw new Error(`GraphQL query error: ${JSON.stringify(data.errors)}`);
    }

    // Ensure data structure integrity
    if (!data.data || !data.data.articles || !Array.isArray(data.data.articles.edges)) {
      throw new Error('Invalid articles data in GraphQL response.');
    }

    // Extract and filter edges
    const articles = data.data.articles.edges
      .filter(edge => edge && edge.node) // Safeguard against null edges
      .map(edge => edge.node);

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

    // Convert articles to CSV
    const csv = parse(articles, { fields });

    const filePath = path.join(process.cwd(), 'article.csv');
    fs.appendFileSync(filePath, csv, 'utf-8');
    console.log(`Batch of articles appended to: ${filePath}`);

    // Process keywords and conditions
    const keywordsConditions = articles.flatMap(article => {
      const keywordEntries = (article.researchKeywords?.nodes || []).filter(node => node).map(node => ({
        articleId: article.id,
        type: 'keyword',
        ...node,
        parentId: node.parent?.node?.id || null
      }));
      const conditionEntries = (article.conditions?.nodes || []).filter(node => node).map(node => ({
        articleId: article.id,
        type: 'condition',
        ...node,
        parentId: node.parent?.node?.id || null
      }));
      return [...keywordEntries, ...conditionEntries];
    });

    // Export to Excel
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(keywordsConditions);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Keywords_Conditions');

    const excelPath = path.join(process.cwd(), 'keywords_conditions.xlsx');
    xlsx.writeFile(workbook, excelPath);
    console.log(`Keywords and conditions exported to: ${excelPath}`);

    // Handle pagination
    if (data.data.articles.pageInfo.hasNextPage) {
      const nextCursor = data.data.articles.pageInfo.endCursor;
      await fetchArticles(nextCursor);
    } else {
      console.log('Pagination completed.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Verify user and fetch articles if verification succeeds
(async () => {
  const isVerified = await verifyUser();
  if (isVerified) {
    await fetchArticles();
  } else {
    console.log('User verification failed. Exiting process.');
  }
})();
