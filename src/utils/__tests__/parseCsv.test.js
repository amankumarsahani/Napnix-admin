import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvObjects } from '../parseCsv';

describe('parseCsv', () => {
    it('parses plain rows and drops blank lines', () => {
        expect(parseCsv('a,b\n1,2\n\n3,4\n')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
    });

    it('keeps commas, quotes and newlines inside quoted fields', () => {
        expect(parseCsv('name,note\n"Globex, Inc","say ""hi""\nthere"')).toEqual([
            ['name', 'note'],
            ['Globex, Inc', 'say "hi"\nthere'],
        ]);
    });

    it('handles CRLF and a BOM', () => {
        expect(parseCsv('﻿email\r\na@x.com\r\n')).toEqual([['email'], ['a@x.com']]);
    });

    it('maps rows to lower-cased header keys', () => {
        const { keys, records } = parseCsvObjects('Email,First_Name\nA@x.com,Ann');
        expect(keys).toEqual(['email', 'first_name']);
        expect(records).toEqual([{ email: 'A@x.com', first_name: 'Ann' }]);
    });
});
