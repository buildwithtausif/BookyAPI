// /*
//     isbn_scanner is developed to search for isbns from different api sources,
//     a fallback system to maintain highest accuracy for isbn search.
// */

// const API_ENDPOINTS = {
//     // UPDATED to the new, more detailed endpoint.
//     openLibrary: "https://openlibrary.org/api/books?bibkeys=ISBN:ISBN_PLACEHOLDER&format=json&jscmd=data",
// };

// /**
//  * A "mapper" function that takes a raw book object from the Open Library API
//  * and transforms it into the clean format our application uses.
//  * This function is tailored to the specific JSON structure you provided.
//  * @param {object} openLibBookData - The raw data object for a single book.
//  * @returns {object|null} A clean book object, or null if parsing fails.
//  */
// function mapOpenLibraryData(openLibBookData) {
//     if (!openLibBookData) {
//         return null;
//     }

//     // Safely extract and format author names from the array of author objects.
//     const authors = openLibBookData.authors ? openLibBookData.authors.map(a => a.name).join(', ') : 'Unknown Author';

//     // Safely extract and format publisher names.
//     const publishers = openLibBookData.publishers ? openLibBookData.publishers.map(p => p.name).join(', ') : null;

//     // Safely extract identifiers.
//     const isbn10 = openLibBookData.identifiers?.isbn_10?.[0] || null;
//     const isbn13 = openLibBookData.identifiers?.isbn_13?.[0] || null;

//     return {
//         title: openLibBookData.title || 'Unknown Title',
//         author: authors,
//         publisher: publishers,
//         isbn10: isbn10,
//         isbn13: isbn13,
//         page_count: openLibBookData.number_of_pages || null,
//         // The cover URL is often available under a 'cover' property
//         cover_url: openLibBookData.cover?.medium || null,
//         // Genre information is not consistently provided by this endpoint.
//         genre: null 
//     };
// }


// /**
//  * Fetches book data from external APIs for a list of ISBNs.
//  * @param {Array<string>} isbns - An array of ISBN numbers to look up.
//  * @returns {Promise<object>} An object containing 'successes' and 'failures' arrays.
//  */
// export default async function isbn_scanner(isbns = []) {
//     if (!isbns || isbns.length === 0) {
//         return { successes: [], failures: [] };
//     }

//     const promises = isbns.map(async (isbn) => {
//         const url = API_ENDPOINTS.openLibrary.replace('ISBN_PLACEHOLDER', isbn);

//         try {
//             const response = await fetch(url);
//             if (!response.ok) {
//                 throw new Error(`API returned status ${response.status}`);
//             }
//             const data = await response.json();
            
//             // The key for this endpoint is predictable: `ISBN:${isbn}`
//             const recordKey = `ISBN:${isbn}`;

//             if (data && data[recordKey]) {
//                 // Use our new mapper function to clean the data
//                 const cleanedData = mapOpenLibraryData(data[recordKey]);

//                 if (cleanedData) {
//                     return { status: 'success', isbn, data: cleanedData };
//                 } else {
//                     throw new Error('Could not parse the book record from API response.');
//                 }
//             } else {
//                 throw new Error('No book record found in API response for this ISBN.');
//             }
//         } catch (error) {
//             return { status: 'failure', isbn, reason: error.message };
//         }
//     });

//     const results = await Promise.all(promises);

//     const successes = results.filter(r => r.status === 'success');
//     const failures = results.filter(r => r.status === 'failure');

//     return { successes, failures };
// }

