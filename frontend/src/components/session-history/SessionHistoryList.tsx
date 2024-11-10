import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Check, XCircle, Loader } from 'lucide-react';
import { QuestionSubmission, QuestionAttempt, Session } from '@/app/sessions/page'; // Import the Session interface

const SessionHistoryList = ({ sessionId }: { sessionId: string }) => {
  const [sessionHistory, setSessionHistory] = useState<Session | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedAttempts, setSelectedAttempts] = useState<QuestionAttempt[]>([]);
  const [questionDetails, setQuestionDetails] = useState<{ [key: string]: any }>({});

  useEffect(() => { 
    async function fetchSessionHistory() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data: Session = await response.json();
        setSessionHistory(data);

        const questionIds = data.questionAttempts.map(attempt => attempt.questionId);
        const questionDetailsMap: { [key: string]: any } = {};
        await Promise.all(questionIds.map(async (questionId) => {
          const questionResponse = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions/${questionId}`);
          const questionData = await questionResponse.json();
          questionDetailsMap[questionId] = questionData;
        }));
        setQuestionDetails(questionDetailsMap);
      } catch (error) {
        console.error('Failed to fetch session history:', error);
      }
    }

    fetchSessionHistory();
  }, [sessionId]);

  const handleQuestionSelect = (questionId: string) => {
    if (sessionHistory) {
      const allAttempts = sessionHistory.questionAttempts.filter(attempt => attempt.questionId === questionId);
      setSelectedAttempts(allAttempts);
      setSelectedQuestion(questionId);
    }
  };

  const getStatusIcon = (status: 'pending' | 'accepted' | 'rejected') => {
    switch (status) {
      case 'accepted':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Loader className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!sessionHistory) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-grow h-full gap-4 p-4 overflow-hidden">
      <Card className="w-1/2 flex flex-col h-full overflow-hidden">
        <CardHeader>
          <CardTitle>
            {selectedQuestion ? (
              <Button
                variant="ghost"
                className="p-0 mb-2"
                onClick={() => setSelectedQuestion(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
            ) :
              "Question List"
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {!selectedQuestion ? (
              <div className="space-y-4">
                {sessionHistory.questionAttempts.map((attempt, index) => (
                  <Card
                    key={`${attempt.questionId}-${index}`}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleQuestionSelect(attempt.questionId)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">
                        {questionDetails[attempt.questionId]?.title || `Question ID: ${attempt.questionId}`}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDate(attempt.startedAt?.toString() || '')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {questionDetails[selectedQuestion]?.title || `Question ID: ${selectedQuestion}`}
                </h3>
                <p className="text-gray-600">
                  {questionDetails[selectedQuestion]?.description || 'Question ID not found'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="w-1/2 flex flex-col h-full overflow-hidden">
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
          {selectedQuestion && (
            <CardDescription>
              Showing all attempts for {questionDetails[selectedQuestion]?.title || `Question ${selectedQuestion}`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden'>
          <ScrollArea className="h-full max-h-full pr-4 overflow-y-auto">
            {selectedQuestion && (
              <div className="space-y-4">
                {selectedAttempts.map((attempt, attemptIndex) => (
                  <div key={attemptIndex}>
                    {attempt.submissions.map((submission, submissionIndex) => (
                      <Card key={submissionIndex} className="bg-gray-50 mb-4">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              Submission {submissionIndex + 1}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(submission.status)}
                              <span className="text-sm capitalize">
                                {submission.status || 'No status'}
                              </span>
                            </div>
                          </div>
                          <CardDescription>
                            Language: {submission.language}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code>{submission.code}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionHistoryList;
// import React, { useEffect, useState } from 'react';
// import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Button } from '@/components/ui/button';
// import { ArrowLeft, Clock, Check, XCircle, Loader } from 'lucide-react';


// const SessionHistoryList = ({ sessionId }) => {
//   const [sessionHistory, setSessionHistory] = useState(null);
//   const [selectedQuestion, setSelectedQuestion] = useState(null);
//   const [selectedAttempts, setSelectedAttempts] = useState([]);
//   const [questionDetails, setQuestionDetails] = useState({});

//   useEffect(() => { 
//     async function fetchSessionHistory() {
//       try {
//         const response = await fetch(`/api/sessions/${sessionId}`);
//         const data = await response.json();
//         setSessionHistory(data);

//         const questionIds = data.questionAttempts.map(attempt => attempt.questionId);
//         const questionDetailsMap = {};
//         await Promise.all(questionIds.map(async (questionId) => {
//           const questionResponse = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions/${questionId}`);
//           const questionData = await questionResponse.json();
//           questionDetailsMap[questionId] = questionData;
//         }));
//         setQuestionDetails(questionDetailsMap);
//       } catch (error) {
//         console.error('Failed to fetch session history:', error);
//       }
//     }

//     fetchSessionHistory();
//   }, [sessionId]);

//   const handleQuestionSelect = (questionId) => {
//     const allAttempts = sessionHistory.questionAttempts.filter(attempt => attempt.questionId === questionId);
//     setSelectedAttempts(allAttempts);
//     setSelectedQuestion(questionId);
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'accepted':
//         return <Check className="w-4 h-4 text-green-500" />;
//       case 'pending':
//         return <Loader className="w-4 h-4 text-yellow-500" />;
//       default:
//         return <XCircle className="w-4 h-4 text-red-500" />;
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleString();
//   };

//   if (!sessionHistory) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="flex flex-grow h-full gap-4 p-4 overflow-hidden">
//       <Card className="w-1/2 flex flex-col h-full overflow-hidden">
//         <CardHeader>
//           <CardTitle>
//             {selectedQuestion ? (
//               <Button
//                 variant="ghost"
//                 className="p-0 mb-2"
//                 onClick={() => setSelectedQuestion(null)}
//               >
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back to Questions
//               </Button>
//             ) :
//               "Question List"
//             }
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="flex-1 overflow-hidden">
//           <ScrollArea className="h-full pr-4">
//             {!selectedQuestion ? (
//               <div className="space-y-4">
//                 {sessionHistory.questionAttempts.map((attempt, index) => (
//                   <Card
//                     key={`${attempt.questionId}-${index}`}
//                     className="cursor-pointer hover:bg-gray-50"
//                     onClick={() => handleQuestionSelect(attempt.questionId)}
//                   >
//                     <CardHeader className="p-4">
//                       <CardTitle className="text-sm">
//                         {questionDetails[attempt.questionId]?.title || `Question ID: ${attempt.questionId}`}
//                       </CardTitle>
//                       <CardDescription className="flex items-center gap-2">
//                         <Clock className="w-4 h-4" />
//                         {formatDate(attempt.startedAt)}
//                       </CardDescription>
//                     </CardHeader>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold">
//                   {questionDetails[selectedQuestion]?.title || `Question ID: ${selectedQuestion}`}
//                 </h3>
//                 <p className="text-gray-600">
//                   {questionDetails[selectedQuestion]?.description || 'Question ID not found'}
//                 </p>
//               </div>
//             )}
//           </ScrollArea>
//         </CardContent>
//       </Card>

//       <Card className="w-1/2 flex flex-col h-full overflow-hidden">
//         <CardHeader>
//           <CardTitle>Submission History</CardTitle>
//           {selectedQuestion && (
//             <CardDescription>
//               Showing all attempts for {questionDetails[selectedQuestion]?.title || `Question ${selectedQuestion}`}
//             </CardDescription>
//           )}
//         </CardHeader>
//         <CardContent className='flex-1 overflow-hidden'>
//           <ScrollArea className="h-full max-h-full pr-4 overflow-y-auto">
//             {selectedQuestion && (
//               <div className="space-y-4">
//                 {selectedAttempts.map((attempt, attemptIndex) => (
//                   <div key={attemptIndex}>
//                     {attempt.submissions.map((submission, submissionIndex) => (
//                       <Card key={submissionIndex} className="bg-gray-50 mb-4">
//                         <CardHeader className="p-4">
//                           <div className="flex items-center justify-between">
//                             <CardTitle className="text-sm">
//                               Submission {submissionIndex + 1}
//                             </CardTitle>
//                             <div className="flex items-center gap-2">
//                               {getStatusIcon(submission.status)}
//                               <span className="text-sm capitalize">
//                                 {submission.status || 'No status'}
//                               </span>
//                             </div>
//                           </div>
//                           <CardDescription>
//                             Language: {submission.language}
//                           </CardDescription>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
//                             <code>{submission.code}</code>
//                           </pre>
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </ScrollArea>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default SessionHistoryList;
