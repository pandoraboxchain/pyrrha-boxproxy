# Database queries syntax

## URL params
Supported URL params are:
- `limit`: records limit per page
- `page`: page number
- `orderBy`: ordering query
- `filterBy`: filtering query

## `orderBy` query  
Pattern:  
```
http://<server_path>:<server_port>/<endpoint>?orderBy=<key>:<order>;<key>:<order>;<key>:<order>
```
Where:  
- `endpoint`: entity endpoint. Can be 'kernels', 'datasets', 'jobs' or 'workers'
- `key`: ordering key. Depends on entity data structure
- `order`: 'ASC' or 'DESC'

Supported multiple ordering of records. Ordering rules should be separated by `;` symbol.

## `filterBy` query 
Pattern:
```
http://<server_path>:<server_port>/<endpoint>?filterBy=<key>:<operator>:<value>:<type>;
```  
Where:
- `endpoint`: same as for 'orderBy' rule
- `key`: filtering key. Depends on entity data structure
- `operator`: filtering opertor (look further)
- `value`: filtering value. Wildcards like `%` are supported
- `type`: data type casting rule. Can be 'string', 'number' or 'boolean'

## Filtering operators
- `gt`: 'key' is greater then 'value'
- `gte`: 'key' is greater then or equal to 'value'
- `lt`: 'key' is lower then 'value'
- `lte`: 'key' is lower then or equal to 'value'
- `ne`: 'key' is not equal to 'value'
- `eq`: 'key' is equal to 'value'
- `not`: 'key' is not a 'value' (boolean)
- `like`: 'key' is like a 'value' (wildcard search pattern)
- `notLike`: 'key' is not like a 'value' (wildcard search pattern)
- `in`: 'key' is in range of 'value's (separated by `,`)
- `notIn`: 'key' is not in range of 'value's

