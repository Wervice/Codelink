#include <stdio.h>
#include <string.h>

int main()
{
	char a[32] = "ab";
	char b[32] = "cd";
	printf("%s", strncat(a, b, 16));
	return -1;
}
