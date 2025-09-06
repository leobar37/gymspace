import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';

interface ClientNotesProps {
  notes?: string;
}

export const ClientNotes: React.FC<ClientNotesProps> = ({ notes }) => {
  if (!notes) return null;

  return (
    <Card className="p-4">
      <Text className="font-semibold text-gray-900 mb-3">Notas</Text>
      <Text className="text-gray-700">{notes}</Text>
    </Card>
  );
};