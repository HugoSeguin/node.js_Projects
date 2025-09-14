const fetch = require('node-fetch');
const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

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
    const filePath = path.join(process.cwd(), 'article.csv');
    fs.appendFileSync(filePath, csv, 'utf-8');

    console.log(`Batch of articles appended to: ${filePath}`);

    // Prepare researchKeywords and conditions data for Excel
    const keywordsConditions = articles.flatMap(article => {
      const keywordEntries = article.researchKeywords.nodes.map(node => ({
        articleId: article.id,
        type: 'keyword',
        ...node,
        parentId: node.parent.node.id
      }));
      const conditionEntries = article.conditions.nodes.map(node => ({
        articleId: article.id,
        type: 'condition',
        ...node,
        parentId: node.parent.node.id
      }));
      return [...keywordEntries, ...conditionEntries];
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(keywordsConditions);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Keywords_Conditions');

    const excelPath = path.join(process.cwd(), 'keywords_conditions.xlsx');
    xlsx.writeFile(workbook, excelPath);

    console.log(`Keywords and conditions exported to: ${excelPath}`);

    // Check if there are more pages to fetch
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

// Start fetching articles
fetchArticles();
