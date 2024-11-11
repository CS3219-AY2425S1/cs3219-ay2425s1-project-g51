import React from 'react';
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AttemptsTab = () => {
  const attempts = [
    {
      id: 1,
      user: {
        name: "Isabella",
        avatar: "/placeholder-user.jpg",
        initials: "IN"
      },
      timestamp: "10 minutes ago",
      language: "Python",
      code: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      testCasesPassed: 3,
      totalTestCases: 3,
      runtime: "56ms",
      memory: "16.4 MB"
    },
    {
      id: 2,
      user: {
        name: "Olivia",
        avatar: "/placeholder-user.jpg",
        initials: "AC"
      },
      timestamp: "15 minutes ago",
      language: "JavaScript",
      code: `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
      testCasesPassed: 2,
      totalTestCases: 3,
      runtime: "62ms",
      memory: "42.5 MB"
    }
  ];

  return (
    <Card className="flex flex-col mt-1 h-full overflow-hidden">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={attempt.user.avatar} />
                    <AvatarFallback>{attempt.user.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{attempt.user.name}</div>
                    <div className="text-xs text-muted-foreground">{attempt.timestamp}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">{attempt.language}</div>
                  <div className={`text-sm ${attempt.testCasesPassed === attempt.totalTestCases ? 'text-green-500' : 'text-yellow-500'}`}>
                    {attempt.testCasesPassed}/{attempt.totalTestCases} tests passed
                  </div>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-4 space-y-4">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{attempt.code}</code>
                  </pre>
                  
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CardDescription>Runtime:</CardDescription>
                      {attempt.runtime}
                    </div>
                    <div className="flex items-center gap-2">
                      <CardDescription>Memory:</CardDescription>
                      {attempt.memory}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default AttemptsTab;