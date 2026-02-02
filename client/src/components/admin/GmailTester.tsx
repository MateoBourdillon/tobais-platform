import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function GmailTester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/debug/gmail');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to test Gmail credentials');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Gmail test failed:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  function formatJson(obj: any) {
    return JSON.stringify(obj, null, 2);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gmail API Credential Tester</CardTitle>
        <CardDescription>
          Test your Gmail API credentials directly to diagnose issues.
          The results will be displayed below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Testing credentials...</span>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">
              Test {result.success ? 'Successful' : 'Failed'}
            </h3>
            <p className="mb-4">{result.message}</p>
            
            {result.envInfo && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-1">Environment Variables</h4>
                <pre className="bg-secondary p-3 rounded text-xs overflow-auto max-h-32">
                  {formatJson(result.envInfo)}
                </pre>
              </div>
            )}
            
            {result.tokenInfo && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-1">Token Information</h4>
                <pre className="bg-secondary p-3 rounded text-xs overflow-auto max-h-32">
                  {formatJson(result.tokenInfo)}
                </pre>
              </div>
            )}
            
            {result.error && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-1">Error Details</h4>
                <pre className="bg-secondary p-3 rounded text-xs overflow-auto max-h-32">
                  {formatJson(result.error)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTest} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : 'Test Gmail Credentials'}
        </Button>
      </CardFooter>
    </Card>
  );
}